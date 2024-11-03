import {Client as _Client} from "@notionhq/client";
import type {ClientOptions} from "@notionhq/client/build/src/Client";
import {
  BlockObjectResponse,
  PageObjectResponse,
  QueryDatabaseParameters,
  QueryDatabaseResponse,
} from "@notionhq/client/build/src/api-endpoints";

export class Client extends _Client {
  constructor(options: ClientOptions = {}) {
    super(options);
  }

  async fetchBlocks(parentId: string): Promise<Block[]> {
    const rawBlocks = await this.blocks.children.list({
      block_id: parentId,
      page_size: 100,
    });
    let blocks = rawBlocks.results;

    if (rawBlocks.has_more) {
      let cursor = rawBlocks.next_cursor;
      do {
        const additional = await this.blocks.children.list({
          block_id: parentId,
          page_size: 100,
          start_cursor: cursor ?? undefined,
        });
        blocks = [...blocks, ...additional.results];
        cursor = additional.next_cursor;
      } while (cursor);
    }

    const result = (await Promise.all(
      (blocks as BlockObjectResponse[]).map(async (block) => {
        if (block.has_children) {

          const blockId =
            block.type === "synced_block" &&
            block.synced_block.synced_from != null
              ? block.synced_block.synced_from.block_id
              : block.id;

          const response = await this.fetchBlocks(blockId);

          return { ...block, blocks: response };
        }
        return Promise.resolve({ ...block, blocks: [] });
      })
    )) as Block[];

    return result;
  }

  async fetchFullPage(pageId: string): Promise<ContentfulPage> {
    const [page, blocks] = await Promise.all([
      this.pages.retrieve({ page_id: pageId }) as Promise<PageObjectResponse>,
      this.fetchBlocks(pageId),
    ]);

    return { ...page, blocks };
  }

  async fetchPageListFromDatabase(params: QueryDatabaseParameters): Promise<QueryDatabaseResults> {
    const response = await this.databases.query(params);
    const result = [...response.results];
    if (response.has_more) {
      const nextParams = {...params, database_id: response.next_cursor};
      const nextResult = await this.fetchPageListFromDatabase(nextParams);
      result.push(...nextResult);
    }

    return result;
  }
}

export type Block = BlockObjectResponse & { blocks: Block[] };
export type ContentfulPage = PageObjectResponse & { blocks: Block[] };
export type QueryDatabaseResults = QueryDatabaseResponse['results'];
export { ClientOptions };
export default Client;
