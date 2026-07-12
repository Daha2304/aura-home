export interface IoBrokerObjectTreeNode {
  id: string;
  name: string;
  type: string;
  role?: string;
  valueType?: string;
  readable?: boolean;
  writable?: boolean;
  unit?: string;
  children: IoBrokerObjectTreeNode[];
}
