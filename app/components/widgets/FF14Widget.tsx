import FF14Icon from "@/app/components/icons/FF14Icon";
import BaseWidget from "./BaseWidget";
import { config } from "@/app/lib/config";

export default function FF14Widget() {
    return (
        <BaseWidget
            title="FF14"
            icon={<FF14Icon />}
            link={config.profiles.ff14.lodestoneUrl || "https://jp.finalfantasyxiv.com/lodestone/"}
            username={config.profiles.ff14.characterName}
            colorScheme="purple"
        />
    );
}