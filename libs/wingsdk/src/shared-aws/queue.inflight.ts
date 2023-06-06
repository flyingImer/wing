import {
  SQSClient,
  SendMessageCommand,
  PurgeQueueCommand,
  GetQueueAttributesCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from "@aws-sdk/client-sqs";
import { IQueueClient, PoppedMessage } from "../cloud";

export class QueueClient implements IQueueClient {
  constructor(
    private readonly queueUrl: string,
    private readonly client: SQSClient = new SQSClient({})
  ) {}

  public async push(message: string): Promise<void> {
    const command = new SendMessageCommand({
      QueueUrl: this.queueUrl,
      MessageBody: message,
    });
    await this.client.send(command);
  }

  public async purge(): Promise<void> {
    const command = new PurgeQueueCommand({
      QueueUrl: this.queueUrl,
    });
    await this.client.send(command);
  }

  public async approxSize(): Promise<number> {
    const command = new GetQueueAttributesCommand({
      QueueUrl: this.queueUrl,
      AttributeNames: ["ApproximateNumberOfMessages"],
    });
    const data = await this.client.send(command);
    return Number.parseInt(data.Attributes?.ApproximateNumberOfMessages ?? "0");
  }

  public async pop(): Promise<PoppedMessage | undefined> {
    const command = new ReceiveMessageCommand({
      QueueUrl: this.queueUrl,
      MaxNumberOfMessages: 1,
    });
    const data = await this.client.send(command);
    if (!data.Messages) {
      return undefined;
    }

    const message = data.Messages[0];
    // For some reason, all fields of a Message object are optional.
    // Though, for example, a message body is required when sending.
    // Hence, receipt handle must be existent for a received message.
    return {
      message: message.Body || "",
      ack: async () => this.delete(message.ReceiptHandle),
    };
  }

  private async delete(receiptHandle?: string): Promise<void> {
    if (!receiptHandle) {
      return;
    }
    const command = new DeleteMessageCommand({
      QueueUrl: this.queueUrl,
      ReceiptHandle: receiptHandle,
    });
    await this.client.send(command);
  }
}
