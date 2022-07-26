interface ISource {
	fetch(): Promise<void>;
	updateStatus(id: string): void;
}

export default ISource;
