declare module "lotion"
{
	import connect from "lotion-connect"

	type HandlerType = "tx" | "block" | "query" | "initializer" | "post-listen"

	type DefaultChainInfo = {
		height: number
		validators: {
			[hash: string]: number
		}
	}

	type BlockHandler<TState, TTransaction, TChainInfo> = (
		state: TState,
		info: TChainInfo & DefaultChainInfo
	) => void

	type TransactionHandler<TState, TTransaction, TChainInfo> = (
		state: TState,
		tx: TTransaction,
		info: TChainInfo & DefaultChainInfo
	) => void

	type InitializeHandler<TState> = (state: TState) => void

	type HandlerFunc<TState, TTransaction, TChainInfo> =
		| TransactionHandler<TState, TTransaction, TChainInfo>
		| InitializeHandler<TState>
		| BlockHandler<TState, TTransaction, TChainInfo>

	type Plugin<TState, TTransaction, TChainInfo> = {
		type: HandlerType
		middleware: HandlerFunc<TState, TTransaction, TChainInfo>
	}
	type Middleware<TState, TTransaction, TChainInfo> =
		| Plugin<TState, TTransaction, TChainInfo>
		| TransactionHandler<TState, TTransaction, TChainInfo>

	type Middlewares<TState, TTransaction, TChainInfo> =
		| Middleware<TState, TTransaction, TChainInfo>
		| Middleware<TState, TTransaction, TChainInfo>[]

	interface IAppInfo
	{
		tendermintPort: number | string
		abciPort: number | string
		txServerPort: number | string
		GCI: string
		p2pPort: number | string
		lotionPath: string
		genesisPath: string
	}
	interface LotionApp<TState, TTransaction, TChainInfo>
	{
		use(middleware: Middlewares<TState, TTransaction, TChainInfo>): LotionApp<TState, TTransaction, TChainInfo>

		useTx(txHandler: TransactionHandler<TState, TTransaction, TChainInfo>): void
		useBlock(blockHandler: BlockHandler<TState, TTransaction, TChainInfo>): void
		useQuery(queryHandler: Function): void
		useInitializer(initializer: Function): void
		usePostListen(postListener: Function): void

		listen(port: number): Promise<IAppInfo>
		close(): void
	}
	interface ILotionInitialConfiguration<TState> {
		devMode?: boolean           // set this true to wipe blockchain data between runs
		initialState?: TState       // initial blockchain state
		keys?: string               // path to keys.json. generates own keys if not specified.
		genesis?: string            // path to genesis.json. generates new one if not specified.
		peers?: string[]            // array of '<host>:<p2pport>' of initial tendermint nodes to connect to. does automatic peer discovery if not specified. 
		logTendermint?: boolean     // if true, shows all output from the underlying tendermint process          
		createEmptyBlocks?: boolean // if false, Tendermint will not create empty blocks which may result in a reduced blockchain file size        
		p2pPort?: number            // port to use for tendermint peer connections      
		tendermintPort?: number     // port to use for tendermint rpc
	}
	interface ILotionModule {
		<TState, TTransaction, TChainInfo>(configuration?: ILotionInitialConfiguration<TState>): LotionApp<TState, TTransaction, TChainInfo>

		connect: typeof connect
	}

	const Lotion: ILotionModule
	export = Lotion
}