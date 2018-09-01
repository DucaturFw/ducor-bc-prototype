import { connect } from "lotion"
import { IState, ITransaction } from "./app"

(async function()
{
	let lc = await connect<IState, ITransaction>("81d3bd28d6404564de759a5bb7e85a0038ba949a900765ff8076a260c451f970")
	console.log(await lc.state)
	await Promise.all([Math.random(), Math.random(), Math.random()]
		.map(x => Math.floor(x * 100))
		.map(x => ({
			type: "provide_data",
			data: { type: "integer", data: x.toFixed(0) },
			key: "xxx",
			provider: "pro_test_1"
		} as ITransaction))
		.map(x => lc.send(x)))
	
	console.log(await lc.state)
	console.log(await lc.getState())
	process.exit()
})()