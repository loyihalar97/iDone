export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 400, code = "BAD_REQUEST", details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static notFound(message = "Resurs topilmadi") {
    return new AppError(message, 404, "NOT_FOUND");
  }

  static forbidden(message = "Ruxsat yo'q") {
    return new AppError(message, 403, "FORBIDDEN");
  }

  static unauthorized(message = "Avtorizatsiyadan o'tilmagan") {
    return new AppError(message, 401, "UNAUTHORIZED");
  }

  static conflict(message = "Holat ziddiyati") {
    return new AppError(message, 409, "CONFLICT");
  }

  static validation(message = "Kiritilgan ma'lumotlar noto'g'ri", details?: unknown) {
    return new AppError(message, 422, "VALIDATION_ERROR", details);
  }
}
