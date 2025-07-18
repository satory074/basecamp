import BaseIcon from "./BaseIcon";
import { IconProps } from "./types";

export function GithubIcon(props: IconProps) {
    return (
        <BaseIcon {...props}>
            <path
                fillRule="evenodd"
                d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63.06 1.08.64 1.48 1.05.08.08.16.11.25.11.53 1.15 1.57.36 1.94.28.08-.65.32-1.11.58-1.35-1.5-.15-3.05-.74-3.05-3.27 0-.72.26-1.31.69-1.77-.07-.15-.3-.83.63-1.74 0 0 .56-.18 1.84.65.54-.15 1.13-.22 1.74-.22.61 0 1.19.07 1.74.22 1.27-.83 1.83-.65 1.83-.65.93.91.7 1.59.64 1.74.43.46.69 1.05.69 1.77 0 2.54-1.55 3.12-3.06 3.27.23.2.44.61.44 1.23 0 .89-.01 1.6-.01 1.84 0 .21.15.45.55.38 3.17-1.07 5.46-4.06 5.46-7.58C16 3.58 12.42 0 8 0z"
            />
        </BaseIcon>
    );
}

// Re-export other icons
export { default as XIcon } from './XIcon';
export { default as DiscordIcon } from './DiscordIcon';
export { default as HatenaIcon } from './HatenaIcon';
export { default as SoundCloudIcon } from './SoundCloudIcon';
export { default as MicroblogIcon } from './MicroblogIcon';
export { default as BooklogIcon } from './BooklogIcon';
export { default as TenhouIcon } from './TenhouIcon';
export { default as FF14Icon } from './FF14Icon';

// Add other icons similarly
