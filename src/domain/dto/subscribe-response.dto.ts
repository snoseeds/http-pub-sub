export class SubscribeResponseDto<T> {
  constructor(
    public url: string,
    public topic: string
  ) {
  }
}