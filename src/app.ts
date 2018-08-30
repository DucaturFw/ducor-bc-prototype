import lotion from "lotion"

console.log('starting app...')

let app = lotion()

console.log('connecting...')

app.listen(8127).then(val =>
{
	console.log('connected!')
	console.log(val)
})