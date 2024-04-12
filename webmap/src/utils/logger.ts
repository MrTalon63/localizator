async function debug(message: string, service?: string): Promise<void> {
	console.log(`[DEBUG]${service ? `[${service}]` : ""} ${message}`);
}

async function info(message: string, service?: string): Promise<void> {
	console.log(`[INFO]${service ? `[${service}]` : ""} ${message}`);
}

async function error(message: string, service?: string): Promise<void> {
	console.log(`[ERROR]${service ? `[${service}]` : ""} ${message}`);
}

export default {
	debug,
	info,
	error,
};
