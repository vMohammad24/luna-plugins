export const isElement = (node: Node | undefined): node is Element => node?.nodeType === Node.ELEMENT_NODE;
