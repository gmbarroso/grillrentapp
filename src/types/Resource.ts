export interface Resource {
  id: string
  type: "daily" | "hourly"
  name: string
}

export const RESOURCES: Resource[] = [
  {
    id: "daily-1",
    type: "daily",
    name: "Daily Resource",
  },
  {
    id: "hourly-1",
    type: "hourly",
    name: "Hourly Resource",
  },
]
