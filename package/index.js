import { Client as _Client } from "@notionhq/client";
export class Client extends _Client {
    constructor(options = {}) {
        super(options);
    }
    async fetchBlocks(parentId) {
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
        const result = (await Promise.all(blocks.map(async (block) => {
            if (block.has_children) {
                const blockId = block.type === "synced_block" &&
                    block.synced_block.synced_from != null
                    ? block.synced_block.synced_from.block_id
                    : block.id;
                const response = await this.fetchBlocks(blockId);
                return { ...block, blocks: response };
            }
            return Promise.resolve({ ...block, blocks: [] });
        })));
        return result;
    }
    async fetchFullPage(pageId) {
        const [page, blocks] = await Promise.all([
            this.pages.retrieve({ page_id: pageId }),
            this.fetchBlocks(pageId),
        ]);
        return { ...page, blocks };
    }
}
export default Client;
