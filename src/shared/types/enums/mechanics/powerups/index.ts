import EarthPUP from "@shared/types/enums/mechanics/powerups/earth";
import FirePUP from "@shared/types/enums/mechanics/powerups/fire";
import WaterPUP from "@shared/types/enums/mechanics/powerups/water";
import MetalPUP from "@shared/types/enums/mechanics/powerups/metal";
import WoodPUP from "@shared/types/enums/mechanics/powerups/wood";


type Powerups = EarthPUP | FirePUP | WaterPUP | MetalPUP | WoodPUP /* | SuperYinPUP | SuperYangPUP */;

export default Powerups;