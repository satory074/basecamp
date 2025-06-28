import TenhouIcon from "@/app/components/icons/TenhouIcon";
import BaseWidget from "./BaseWidget";
import { config } from "@/app/lib/config";

export default function TenhouWidget() {
    return (
        <BaseWidget
            title="天鳳"
            icon={<TenhouIcon />}
            link={config.profiles.tenhou.url}
            username={config.profiles.tenhou.username}
            colorScheme="green"
        />
    );
}