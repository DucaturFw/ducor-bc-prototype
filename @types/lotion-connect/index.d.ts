declare module "lotion-connect"
{
	interface ILotionConnectResponse<TState extends { }, TTransaction extends { }>
	{
		send: (tx: TTransaction) => Promise<any>
		state: Promise<TState>
		getState(): Promise<TState>
		getState(path: string): Promise<any>
	}
	interface ILotionConnectOpts
	{
		nodes?: string[]
		genesis?: {
			validators: any
			chain_id: string
		}
	}
	function connect<TState extends { }, TTransaction extends { }>(GCI: string, opts?: ILotionConnectOpts): ILotionConnectResponse<TState, TTransaction>
	
	export = connect
}