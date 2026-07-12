export interface IoBrokerObjectTreeNode {
  id: string;
  name: string;
  type: string;
  role?: string;
  valueType?: string;
  readable?: boolean;
  writable?: boolean;
  unit?: string;
  min?: number;
  max?: number;
  value?: unknown;
  ack?: boolean;
  ts?: number;
  children: IoBrokerObjectTreeNode[];
}
