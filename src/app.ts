import lotion from "lotion"

console.log('starting app...')

type IFloat = { amount: string, decimals: string }

interface ITextData
{
	type: "text"
	data: string
}
interface IIntData
{
	type: "integer"
	data: string
}
interface IFloatData
{
	type: "float"
	data: IFloat
}
type IData = ITextData | IIntData

interface IProvidedData<TData extends IData>
{
	provider: string
	data: TData
}

interface IAggregatedTextData
{
	type: "text"
	stringMetric: number // allowed string distance between provided strings (0 means exact matches)
	totalProviders: number
	data: string
	matched: string[] // pub keys of matched data providers
	mismatched: string[] // pub keys of mismatched data providers
}
interface IAggregatedIntData
{
	type: "integer"
	totalProviders: number
	maxDistance: number // max allowed distance to median value

	average: number // average value: sum(a, b, c) / count(a, b, c)
	median: string // median value: mid-point of all provided data
	mostFrequent: string // most frequently provided data (if more than 1 provider gave identical values)
	                     // conflict resolution up to discussion: if provided [1,1,1,3,3,3], avg would be 2, median would be 2, and mostFrequent can be either 1 or 3
	exactMatches: string[] // pub keys of matched data providers (for most frequent data)
	actualDistance: number // actual highest distance between provided data and median value
	used: string[] // pub keys of data providers that were used to calculate data
	eliminated: string[] // pub keys of data providers with invalid data (distance between their data and median was too high)
}

type IAggregatedData = IAggregatedIntData | IAggregatedTextData

export interface IState
{
	dataStorage: { 
		text: { [key: string]: IAggregatedTextData }
		integer: { [key: string]: IAggregatedIntData }
	},
	dataCandidates: {
		text: { [key: string]: IProvidedData<ITextData>[] }
		integer: { [key: string]: IProvidedData<IIntData>[] }
	}
}
interface IProvideDataTransaction
{
	type: "provide_data"
	key: string
	provider: string
	data: IData
}
export type ITransaction = IProvideDataTransaction

let app = lotion<IState, ITransaction, { }>({
	initialState: {
		dataCandidates: { text: { }, integer: { } },
		dataStorage: { text: { }, integer: { } }
	}
})

app.use((state, tx, info) =>
{
	console.log(state, tx, info)
	if (tx.type == "provide_data")
	{
		let candidates = state.dataCandidates[tx.data.type as keyof typeof state.dataCandidates]
		if (!candidates[tx.key])
			candidates[tx.key] = []
		let data = { data: tx.data, provider: tx.provider } as IProvidedData<IData>
		(candidates[tx.key] as IProvidedData<IData>[]).push(data)
	}
})
app.useBlock((state, info) =>
{
	console.log('new block')
	for (let key in state.dataCandidates.text)
	{
		let stringMetric = 0
		if (state.dataStorage.text[key])
			stringMetric = state.dataStorage.text[key].stringMetric
		
		let aggr = aggregateText(state.dataCandidates.text[key], stringMetric)
		state.dataStorage.text[key] = aggr
		console.log(key, aggr)
	}
	for (let key in state.dataCandidates.integer)
	{
		let maxDistance = 0
		if (state.dataStorage.integer[key])
			maxDistance = state.dataStorage.integer[key].maxDistance
		
		let aggr = aggregateInt(state.dataCandidates.integer[key], maxDistance)
		state.dataStorage.integer[key] = aggr
		console.log(key, aggr)
	}
	state.dataCandidates = { text: { }, integer: { } }
})

function aggregateText(datas: IProvidedData<ITextData>[], stringMetric: number): IAggregatedTextData
{
	if (stringMetric != 0)
		throw "non-exact string matches are not possible yet"
	
	let { value: usedString } = mostFrequent(entriesCount(datas.map(x => x.data.data)))
	let matched = datas.filter(x => x.data.data == usedString).map(x => x.provider)
	let mismatched = datas.filter(x => x.data.data != usedString).map(x => x.provider)
	
	return {
		type: "text",
		matched,
		mismatched,
		data: usedString,
		totalProviders: datas.length,
		stringMetric,
	}
}
function entriesCount(strings: string[]): { [key: string]: number }
{
	return strings.reduce((acc, str) => (acc[str] = (acc[str] ? acc[str] + 1 : 1), acc), { } as { [key: string]: number })
}
function mostFrequent(entries: { [key: string]: number }): { value: string, count: number }
{
	let max = 0
	let usedString = ""
	for (let s in entries)
	{
		if (max < entries[s])
		{
			usedString = s
			max = entries[s]
		}
	}
	return { count: max, value: usedString }
}
function median(numbers: number[]): number // TODO: change to string values
{
	let idx = Math.floor(numbers.length / 2)
	return numbers.sort()[idx]
}
function numberDistance(a: number, b: number): number
{
	a = Math.abs(a)
	b = Math.abs(b)
	return Math.abs(a - b)
}
function aggregateInt(datas: IProvidedData<IIntData>[], maxDistance: number): IAggregatedIntData
{
	let med = median(datas.map(x => parseInt(x.data.data)))
	let used = datas.filter(x => numberDistance(parseInt(x.data.data), med) <= maxDistance)
	let eliminated = datas.filter(x => used.indexOf(x) == -1)
	let realMedian = median(used.map(x => parseInt(x.data.data)))
	let average = used.map(x => parseInt(x.data.data)).reduce((acc, cur) => acc + cur, 0) / used.length
	let exactMatches = datas.filter(x => parseInt(x.data.data) == realMedian).map(x => x.provider)
	let actualDistance = Math.max(...used.map(x => numberDistance(realMedian, parseInt(x.data.data))))
	let { value: mostCommon } = mostFrequent(entriesCount(used.map(x => x.data.data)))

	return {
		type: "integer",
		average,
		median: realMedian.toFixed(0),
		mostFrequent: mostCommon,
		totalProviders: datas.length,
		used: used.map(x => x.provider),
		eliminated: eliminated.map(x => x.provider),
		exactMatches,
		actualDistance,
		maxDistance,
	}
}

console.log('connecting...')
app.listen(8127).then(val =>
{
	console.log('connected!')
	console.log(val)
})