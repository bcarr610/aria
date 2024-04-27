type DevicesQuery = {
  id: string;
  type: string;
  room: string;
  group: string;
  favorite: boolean;
  online: boolean;
  registration: "pending" | "registered";
};
