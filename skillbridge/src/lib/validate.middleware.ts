import Joi from "joi";

export function validateBody(schema: Joi.Schema, body: any) {
  const { error, value } = schema.validate(body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const message = error.details.map((d) => d.message).join(", ");
    throw new Error(`Validation error: ${message}`);
  }
  return value;
}
