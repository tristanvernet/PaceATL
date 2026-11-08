import { useState } from "react";
import {Screen,Heading,BackButton,Card,Label,Button,Field,Notice,} from "../../components/ui";

import { apiRequest } from "../../api/client";


const CATEGORIES = [
  { label: "Poor Lighting", value: "lighting" },
  { label: "Hazard / Obstruction", value: "hazard" },
  { label: "Suspicious Activity", value: "suspicious" },
  { label: "Uneven Surface", value: "surface" },
];

export function SafetyReport({
  onClose,
  currentLocation,
  routeId,
}: {
  visible: boolean;
  onClose: () => void;
  currentLocation?: { latitude: number; longitude: number };
  routeId?: number;
}) {
  const [category, setCategory] = useState("hazard");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      await apiRequest("/api/safety/report", {
        method: "POST",
        body: JSON.stringify({
          title: `Safety Concern: ${category}`,
          category,
          description,
          latitude: currentLocation?.latitude || 33.749,
          longitude: currentLocation?.longitude || -84.388,
          routeId,
        }),
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setDescription("");
        onClose();
      }, 1500);
    } catch (err) {
      alert("Failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

   return (
    <Screen>
      <BackButton />
      <Heading
        eyebrow="Safety"
        title="Report a hazard"
        subtitle="Reports are reviewed by an administrator."
      />
      {success ? (
        <Notice text="Report submitted for admin review!" />
      ) : (
        <Card>
          <Label>Select category</Label>
          {CATEGORIES.map((cat) => (
            <Button
              key={cat.value}
              title={cat.label}
              secondary={category !== cat.value}
              onPress={() => setCategory(cat.value)}
            />
          ))}
          <Field
            label="Description (optional)"
            placeholder="Details"
            multiline
            numberOfLines={3}
            style={{ minHeight: 96, textAlignVertical: "top" }}
            value={description}
            onChangeText={setDescription}
          />
          {error ? <Notice text={error} error /> : null}
          <Button title="Submit report" loading={submitting} onPress={handleSubmit} />
        </Card>
      )}
    </Screen>
  );
}