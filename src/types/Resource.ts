export interface Resource {
  id: string
  type: "grill" | "tennis"
  name: string
}

export const RESOURCES: Resource[] = [
  {
    id: "grill-1",
    type: "grill",
    name: "Grill",
  },
  {
    id: "tennis-1",
    type: "tennis",
    name: "Tennis Court",
  },
]