export class PublishResponseDto<T> {
  constructor(
    public topic: string,
    public data: T
  ) {
  }
}