export class JSendResponseDto<T> {
  constructor(
    public status: string,
    public statusCode: number,
    public message: string,
    public data: T
  ) {
  }
}