// Runs a zod schema against req.body (or req.query / req.params) and
// replaces it with the cleaned result, so handlers only see valid data.
export const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
  }
  req[source] = result.data;
  next();
};
