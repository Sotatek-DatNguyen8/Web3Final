import { BigInt } from "@graphprotocol/graph-ts";
import {
  MasterChef,
  Deposit,
  EmergencyWithdraw,
  OwnershipTransferred,
  Withdraw,
} from "../generated/MasterChef/MasterChef";
import { HistoryEntity } from "../generated/schema";

export function handleDeposit(event: Deposit): void {
  let entity = HistoryEntity.load(event.transaction.hash.toHex());
  if (!entity) {
    entity = new HistoryEntity(event.transaction.hash.toHex());
    entity.amount = event.params.amount;
    entity.eventName = "DEPOSIT";
    entity.user = event.transaction.from;
    entity.transactionTime = event.block.timestamp;
    entity.save();
  }
}

export function handleEmergencyWithdraw(event: EmergencyWithdraw): void {}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {}

export function handleWithdraw(event: Withdraw): void {
  let entity = HistoryEntity.load(event.transaction.hash.toHex());
  if (!entity) {
    entity = new HistoryEntity(event.transaction.hash.toHex());
    entity.amount = event.params.amount;
    entity.eventName = "WITHDRAW";
    entity.user = event.transaction.from;
    entity.transactionTime = event.block.timestamp;
    entity.save();
  }
}
