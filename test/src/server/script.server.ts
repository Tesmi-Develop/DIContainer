import { Dependency, DependencyContainer } from "@rbxts/di-container";

const container = new DependencyContainer();

class A {
	public Da = "Da";
}

class B {
	@Dependency()
	public a!: A;
}

container.Registery<A>(new A());

const res = new B();
container.Inject(res);

print(res);
