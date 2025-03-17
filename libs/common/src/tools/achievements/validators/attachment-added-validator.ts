import { earnedEvent } from "../achievement-events";
import { Type } from "../data";
import {
  AchievementId,
  AchievementProgressEvent,
  AchievementValidator,
  MetricId,
  UserActionEvent,
} from "../types";

export class AttachmentAddedValidator implements AchievementValidator {
  base: AchievementValidator;
  get achievement() {
    return "item-attached" as AchievementId;
  }
  get name() {
    return "1st attachment added to item";
  }
  get metric() {
    // Does this need to match vault-item-created-count-validator metric id for "item-quantity"
    return "item-quantity" as MetricId;
  }
  get validator() {
    return Type.HasTag;
  }
  get active() {
    return this.base.active;
  }
  get hidden() {
    return false;
  }

  constructor() {
    this.base.active = "until-earned";
  }

  trigger(item: UserActionEvent) {
    return item.tags?.includes("with-attachment") ?? false;
  }

  award(_measured: AchievementProgressEvent[]) {
    return [earnedEvent(this.achievement)];
  }
}
