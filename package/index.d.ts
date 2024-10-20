import { Client as _Client } from "@notionhq/client";
import type { ClientOptions } from "@notionhq/client/build/src/Client";
import type { BlockObjectResponse, PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
export declare class Client extends _Client {
    constructor(options?: ClientOptions);
    fetchBlocks(parentId: string): Promise<Block[]>;
    fetchFullPage(pageId: string): Promise<ContentfulPage>;
}
export type Block = BlockObjectResponse & {
    blocks: Block[];
};
export type ContentfulPage = PageObjectResponse & {
    blocks: Block[];
};
export { ClientOptions };
export default Client;
