export type TBytes = string
export type TPublicKey = string
export type TPrivateKey = string
export type TSignature = string
export type THash = string

export interface ITx
{
	from: TPublicKey
	data: TBytes
	hash: THash
	sig: TSignature
}
export interface IBlock
{
	prevHash: THash
	hash: THash
	index: number
	txs: ITx[]
	producer: TPublicKey
}
export interface IBlockchain
{
	blocks: IBlock[]
	mempool: ITx[]
	knownTxs: { [key: string]: ITx }
	blockProducers: TPublicKey[]
	BLOCK_PRODUCERS_CONSEQUENT_BLOCKS: number
}

export function getHash(data: TBytes): THash
{
	return data.split('').map(c => c.charCodeAt(0)).reduce((a, b) => a + b, 0).toString()
}
export function checkHash(data: TBytes, hash: THash): boolean
{
	return hash == getHash(data)
}
export function checkSig(data: TBytes, from: TPublicKey, sig: TSignature): boolean
{
	let sig2 = getHash(getHash(data) + getHash(from))
	return sig == sig2
}
export function checkTx(tx: ITx): [false, string] | [true, never?]
{
	if (!checkHash(tx.data, tx.hash))
		return [false, "incorrect hash"]
	
	if (!checkSig(tx.data, tx.from, tx.sig))
		return [false, "incorrect signature"]
	
	return [true]
}
export function pushTx(b: IBlockchain, tx: ITx)
{
	let [txres, txerrmsg] = checkTx(tx)

	if (!txres)
		return txerrmsg
	
	if (b.mempool.some(x => tx.hash == x.hash))
		return "transaction is already in mempool"
	
	if (b.knownTxs[tx.hash])
		return "transaction is already in blockchain"

	b.mempool.push(tx)
}
export function addBlock(b: IBlockchain, block: IBlock)
{
	if (block.txs.some(tx => !checkTx(tx)[0]))
		return "block contains invalid tx"
	
	let h2 = getHash(block.producer + block.prevHash + block.txs.map(tx => tx.hash).join())
	if (h2 != block.hash)
		return "invalid block hash"
	
	if (block.index != blockHeight(b))
		return "invalid block index"
	
	if (b.blocks.length && (b.blocks[b.blocks.length - 1].hash != block.prevHash))
		return "invalid prev block hash"
	
	if (block.txs.some(tx => !!b.knownTxs[tx.hash]))
		return "block contains already mined tx"
	
	b.blocks.push(block)
	b.knownTxs = { ...b.knownTxs, ...block.txs.reduce((acc, tx) => (acc[tx.hash] = tx, acc), { } as typeof b.knownTxs) }
	b.mempool = b.mempool.filter(tx => !b.knownTxs[tx.hash])
}
export function privateToPublic(key: TPrivateKey): TPublicKey
{
	return key.split('').map(c => String.fromCharCode(c.charCodeAt(0) + 1)).join('')
}
export function produceBlock(b: IBlockchain, producer: TPrivateKey): IBlock
{
	let txs = b.mempool.slice()
	let prevHash = b.blocks.length ? b.blocks[b.blocks.length - 1].hash : "0"
	let hash = getHash(privateToPublic(producer) + prevHash + txs.map(tx => tx.hash).join())
	let index = blockHeight(b)
	return {
		index,
		hash,
		prevHash,
		producer,
		txs,
	}
}
export function blockHeight(b: IBlockchain): number
{
	return b.blocks.length
}
export function getProducerIndexForBlock(b: IBlockchain, blockNumber?: number): number
{
	if (typeof blockNumber === "undefined")
		blockNumber = blockHeight(b)
	
	return Math.floor(blockNumber / b.BLOCK_PRODUCERS_CONSEQUENT_BLOCKS) % b.blockProducers.length
}
