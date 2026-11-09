import { getDatabase } from "../../database.js";
import { sessionUser } from "../auth/service.js";
export class RewardError extends Error { constructor(code,message,status=400){super(message);this.code=code;this.status=status;} }
export const BADGES=[
 {key:"first_workout",name:"First Step",description:"Log your first workout.",icon:"footsteps",test:s=>s.workoutCount>=1},
 {key:"five_workouts",name:"Getting Consistent",description:"Log 5 workouts.",icon:"flame",test:s=>s.workoutCount>=5},
 {key:"five_miles",name:"Five Mile Club",description:"Record 5 total miles.",icon:"ribbon",test:s=>s.totalDistanceMiles>=5},
 {key:"hour_active",name:"Hour of Power",description:"Record 60 total active minutes.",icon:"time",test:s=>s.totalMinutes>=60},
];
export function validateActivity(body){const distanceMiles=typeof body?.distanceMiles === "number" ? body.distanceMiles : NaN,durationMinutes=typeof body?.durationMinutes === "number" ? body.durationMinutes : NaN,activityType=typeof body?.activityType==="string"?body.activityType.trim().toLowerCase():"";if(!["run","walk","cycle","other"].includes(activityType))throw new RewardError("INVALID_ACTIVITY","Choose run, walk, cycle, or other.");if(!Number.isFinite(distanceMiles)||distanceMiles<0||distanceMiles>500)throw new RewardError("INVALID_DISTANCE","Distance must be between 0 and 500 miles.");if(!Number.isFinite(durationMinutes)||durationMinutes<1||durationMinutes>1440)throw new RewardError("INVALID_DURATION","Duration must be between 1 and 1440 minutes.");return{activityType,distanceMiles:Math.round(distanceMiles*100)/100,durationMinutes:Math.round(durationMinutes)};}
async function summary(database,userId){const[rows]=await database.execute(`SELECT COUNT(*) AS workoutCount, COALESCE(SUM(distance_miles),0) AS totalDistanceMiles, COALESCE(SUM(duration_minutes),0) AS totalMinutes FROM reward_activity_events WHERE user_id = ?`,[userId]);return{workoutCount:Number(rows[0].workoutCount),totalDistanceMiles:Number(rows[0].totalDistanceMiles),totalMinutes:Number(rows[0].totalMinutes)};}
async function awardEligible(database,userId,stats){const unlocked=[];for(const badge of BADGES.filter(b=>b.test(stats))){const[result]=await database.execute("INSERT IGNORE INTO user_achievements (user_id, achievement_key) VALUES (?, ?)",[userId,badge.key]);if(result.affectedRows)unlocked.push(badge);}return unlocked;}
export async function rewardsForRequest(req){const user=await sessionUser(req),database=getDatabase(),stats=await summary(database,user.id);const[rows]=await database.execute("SELECT achievement_key AS achievementKey, earned_at AS earnedAt FROM user_achievements WHERE user_id = ? ORDER BY earned_at DESC",[user.id]);const earned=new Map(rows.map(r=>[r.achievementKey,r.earnedAt]));return{stats,achievements:BADGES.map(({test,...badge})=>({...badge,unlocked:earned.has(badge.key),earnedAt:earned.get(badge.key)||null}))};}
// Runs inside the caller's transaction, after the caller has locked the user's row.
// A workoutId links the event to a logged workout so deleting the workout removes it.
export async function recordActivity(connection,userId,activity,workoutId=null) {
 // workout_id is only written when set, so sample activity still works before db:setup adds the column.
 const values=[userId,activity.activityType,activity.distanceMiles,activity.durationMinutes];
 await connection.execute(workoutId==null
  ? "INSERT INTO reward_activity_events (user_id, activity_type, distance_miles, duration_minutes) VALUES (?, ?, ?, ?)"
  : "INSERT INTO reward_activity_events (user_id, activity_type, distance_miles, duration_minutes, workout_id) VALUES (?, ?, ?, ?, ?)",
  workoutId==null?values:[...values,workoutId]);
 const stats=await summary(connection,userId), unlocked=await awardEligible(connection,userId,stats);
 return {stats,unlocked:unlocked.map(({test,...badge})=>badge)};
}
export async function recordRewardActivity(req,body) {
 const user=await sessionUser(req), activity=validateActivity(body);
 const connection=await getDatabase().getConnection();
 try {
  await connection.beginTransaction();
  await connection.execute("SELECT id FROM users WHERE id = ? FOR UPDATE", [user.id]);
  const result=await recordActivity(connection,user.id,activity);
  await connection.commit();
  return {activity,...result};
 } catch(error) { await connection.rollback(); throw error; }
 finally { connection.release(); }
}
