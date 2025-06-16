export enum LikeStatusEnum {
  None = "None",
  Like = "Like",
  Dislike = "Dislike",
}

export const mapEnumLikeStatusToBdStatus = (status: LikeStatusEnum) => {
  switch (status) {
    case LikeStatusEnum.None:
      return 0;
    case LikeStatusEnum.Like:
      return 1;
    case LikeStatusEnum.Dislike:
      return 2;
  }
};
