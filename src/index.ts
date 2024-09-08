import { Constructor, CreateAttribute, GetType } from "@rbxts/reflection";

export function GetDeferredConstructor<T extends object>(ctor: Constructor<T>) {
	const obj = setmetatable({}, ctor as never) as T;

	return [
		obj,
		(...args: ConstructorParameters<Constructor<T>>) => {
			(obj as { "constructor"(...args: unknown[]): unknown }).constructor(...args);
		},
	] as const;
}

type Factory = (ctor?: Constructor) => unknown;

export const Dependency = CreateAttribute(class {});

export class DependencyContainer {
	private factories = new Map<string, Factory>();

	constructor(private parent?: DependencyContainer) {}

	private registery(id: string, impl: Factory) {
		this.factories.set(id, impl);
	}

	public Registery<T>(impl: T): void;
	public Registery<T>(impl: Factory): void;
	public Registery<T>(impl: Factory | T) {
		const id = GetType<T>().FullName;

		if (typeIs(impl, "function")) {
			this.registery(id, impl as Factory);
			return;
		}

		this.registery(id, () => impl);
	}

	private resolve(id: string, ctor?: Constructor) {
		const factory = this.factories.get(id);

		if (!factory) {
			throw `No factory found for ${id}`;
		}

		return factory(ctor);
	}

	public Resolve<T>(ctor?: Constructor) {
		const id = GetType<T>().FullName;
		return this.resolve(id, ctor);
	}

	public Inject<T extends object>(obj: T): T {
		const _type = GetType(obj);
		_type.Properties.forEach((prop) => {
			if (!prop.HaveAttribute<typeof Dependency>()) return;

			const injectedType = prop.Type.FullName;
			const value = this.resolve(injectedType, _type.IsClass() ? (obj as Constructor) : undefined);

			prop.Set(obj, value);
		});

		return obj;
	}
}
