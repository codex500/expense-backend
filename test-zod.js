const { z } = require('zod');
const schema = z.object({
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of Birth must be in YYYY-MM-DD format').optional(),
});
try {
  schema.parse({ dob: "" });
  console.log("Passed empty string");
} catch (e) {
  console.log("Failed empty string:", e.errors);
}
try {
  schema.parse({ dob: undefined });
  console.log("Passed undefined");
} catch (e) {
  console.log("Failed undefined:", e.errors);
}
