interface ITx
{
	from: string
	data: string
	hash: string
	sig: string
}
interface IBlock
{
	prevHash: string
	hash: string
	txs: ITx[]
	producer: string
}
interface IBlockchain
{
	blocks: IBlock[]
	mempool: ITx[]
	knownTxs: { [key: string]: ITx }
}

function getHash(data: string): string
{
	return data.split('').map(c => c.charCodeAt(0)).reduce((a, b) => a + b, 0).toString()
}
function checkHash(data: string, hash: string): boolean
{
	return hash == getHash(data)
}
function checkSig(data: string, from: string, sig: string): boolean
{
	let sig2 = getHash(getHash(data) + getHash(from))
	return sig == sig2
}
function checkTx(tx: ITx): [false, string] | [true, never?]
{
	if (!checkHash(tx.data, tx.hash))
		return [false, "incorrect hash"]
	
	if (!checkSig(tx.data, tx.from, tx.sig))
		return [false, "incorrect signature"]
	
	return [true]
}
function pushTx(b: IBlockchain, tx: ITx)
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
function addBlock(b: IBlockchain, block: IBlock)
{
	if (block.txs.some(tx => !checkTx(tx)[0]))
		return "block contains invalid tx"
	
	let h2 = getHash(block.producer + block.prevHash + block.txs.map(tx => tx.hash).join())
	if (h2 != block.hash)
		return "invalid block hash"
	
	if (b.blocks.length && (b.blocks[b.blocks.length - 1].hash != block.prevHash))
		return "invalid prev block hash"
	
	if (block.txs.some(tx => !!b.knownTxs[tx.hash]))
		return "block contains already mined tx"
	
	b.blocks.push(block)
	b.knownTxs = { ...b.knownTxs, ...block.txs.reduce((acc, tx) => (acc[tx.hash] = tx, acc), { } as typeof b.knownTxs) }
	b.mempool = b.mempool.filter(tx => !b.knownTxs[tx.hash])
}
function produceBlock(b: IBlockchain, producer: string): IBlock
{
	let txs = b.mempool.slice()
	let prevHash = b.blocks.length ? b.blocks[b.blocks.length - 1].hash : "0"
	let hash = getHash(producer + prevHash + txs.map(tx => tx.hash).join())
	return {
		hash,
		prevHash,
		producer,
		txs
	}
}
function blockHeight(b: IBlockchain): number
{
	return b.blocks.length
}