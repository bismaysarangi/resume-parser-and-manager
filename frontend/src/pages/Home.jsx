import { Button } from "@/components/ui/button";
import { Badge } from "../components/ui/badge";

const Home = () => {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center font-[Montserrat]">
      <Button>Click me</Button>
      <Badge>Badge</Badge>
    </div>
  );
};

export default Home;
