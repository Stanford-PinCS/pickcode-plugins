def get_population_parameters():
    initial_pop_size = 30
    growth_rate = 0.5
    return initial_pop_size, growth_rate

N0, r = get_population_parameters()
create_simulation_exponential(N0, r, 10, 2000)
