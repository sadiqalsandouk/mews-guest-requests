import type { Category } from "@/lib/requests";

// What a guest can ask for with one tap (`short` is the tile, `label` the request). The guest app shows these as
// buttons; the decision model ticks the ones that match what they type or say.
// `ask` is the yes/no question the model answers for each one. Each starts
// "Among other things" and lists examples: without that, a message asking
// for several things ("towels and toothpaste") scored toiletries at 3%.
export const OPTIONS = [
  { id: "towels", short: "Towels", label: "Extra towels", group: "For your room", category: "Housekeeping", ask: "Among other things, the guest asks for towels, bath towels, hand towels, bath mats or bathrobes." },
  { id: "pillows", short: "Pillows", label: "Extra pillows", group: "For your room", category: "Housekeeping", ask: "Among other things, the guest asks for pillows, blankets, duvets, sheets or other bedding." },
  { id: "toiletries", short: "Toiletries", label: "Toiletries", group: "For your room", category: "Housekeeping", ask: "Among other things, the guest asks for any toiletry or bathroom item: toothpaste, toothbrush, soap, shampoo, conditioner, shower gel, razor, comb, cotton buds, lotion, sanitary products, toilet paper." },
  { id: "drinks", short: "Drinks", label: "Water and coffee", group: "For your room", category: "Housekeeping", ask: "Among other things, the guest asks for drinking water, bottled water, coffee, coffee pods, tea, milk or sugar." },
  { id: "cleaning", short: "Cleaning", label: "Room cleaning", group: "For your room", category: "Housekeeping", ask: "Among other things, the guest asks for the room to be cleaned or tidied, the bin emptied, or a spill or mess cleaned up." },
  { id: "hotWater", short: "Water", label: "Water or shower problem", group: "Something's not working", category: "Maintenance", ask: "Among other things, the guest reports a problem with hot water, the shower, water pressure, the taps, the toilet flush or a leak." },
  { id: "temperature", short: "Heating / AC", label: "Too hot or too cold", group: "Something's not working", category: "Maintenance", ask: "Among other things, the guest says the room is too hot or too cold, or the heating, radiator, air con or fan isn't working right." },
  { id: "tvWifi", short: "TV / Wi-Fi", label: "TV or Wi-Fi", group: "Something's not working", category: "Maintenance", ask: "Among other things, the guest reports a problem with the TV, the remote, channels, Wi-Fi, internet or casting." },
  { id: "broken", short: "Broken", label: "Something is broken", group: "Something's not working", category: "Maintenance", ask: "Among other things, the guest reports something else broken or not working: lights, lamps, plugs, door lock, key card, window, curtains, safe, kettle, fridge, hairdryer, furniture. Not water, heating, air con, TV or Wi-Fi." },
  { id: "lateCheckout", short: "Late checkout", label: "Late checkout", group: "Front desk", category: "Front desk", ask: "Among other things, the guest asks to check out later or to extend their stay." },
  { id: "taxi", short: "Taxi", label: "Book a taxi", group: "Front desk", category: "Front desk", ask: "Among other things, the guest asks for a taxi, cab, car, airport transfer or other transport." },
  { id: "luggage", short: "Luggage", label: "Help with luggage", group: "Front desk", category: "Front desk", ask: "Among other things, the guest asks for help with luggage, bags or suitcases, or to store them." },
] as const satisfies readonly { id: string; short: string; label: string; group: string; category: Category; ask: string }[];

export type OptionId = (typeof OPTIONS)[number]["id"];
export const isOptionId = (x: unknown): x is OptionId => OPTIONS.some((o) => o.id === x);
