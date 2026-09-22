// Request validation middleware using Zod
export function validate(schema) {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        const flattened = result.error.flatten();
        const fieldErrors = flattened.fieldErrors || {};
        // Preserve field-level error structure for tests and API consumers
        return res.status(400).json({ errors: fieldErrors });
      }
      req.validated = result.data;
      next();
    } catch (err) {
      next(err);
    }
  };
}
