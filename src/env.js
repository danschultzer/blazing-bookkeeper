import jetpack from 'fs-jetpack'

var env = jetpack.cwd(__dirname).read('env.json', 'json')

export default env
