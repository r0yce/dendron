declare module "yaml-unist-parser" {
  export interface YamlNode {
    type: string;
    children?: YamlNode[];
    value?: string;
  }

  export interface YamlParent extends YamlNode {
    children: YamlNode[];
  }

  export type Node = YamlNode;
  export type Parent = YamlParent;
  export type Literal = YamlNode & {
    value: string;
    position?: import("unist").Position;
  };
  export type Mapping = YamlParent;
  export type MappingItem = YamlParent & {
    children: YamlNode[];
    position?: import("unist").Position;
  };
  export type Plain = YamlNode;
  export type QuoteDouble = YamlNode;
  export type QuoteSingle = YamlNode;

  export function parse(value: string): YamlParent;
}