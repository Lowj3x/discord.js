'use client';

import type { ApiItemKind } from '@microsoft/api-extractor-model';
import { VscArrowRight } from '@react-icons/all-files/vsc/VscArrowRight';
import { VscSymbolClass } from '@react-icons/all-files/vsc/VscSymbolClass';
import { VscSymbolEnum } from '@react-icons/all-files/vsc/VscSymbolEnum';
import { VscSymbolField } from '@react-icons/all-files/vsc/VscSymbolField';
import { VscSymbolInterface } from '@react-icons/all-files/vsc/VscSymbolInterface';
import { VscSymbolMethod } from '@react-icons/all-files/vsc/VscSymbolMethod';
import { VscSymbolProperty } from '@react-icons/all-files/vsc/VscSymbolProperty';
import { VscSymbolVariable } from '@react-icons/all-files/vsc/VscSymbolVariable';
import { Dialog } from 'ariakit/dialog';
import { Command } from 'cmdk';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useKey } from 'react-use';
import { useCmdK } from '~/contexts/cmdK';
import { client } from '~/util/search';

function resolveIcon(item: keyof typeof ApiItemKind) {
	switch (item) {
		case 'Class':
			return <VscSymbolClass className="shrink-0" size={25} />;
		case 'Enum':
			return <VscSymbolEnum className="shrink-0" size={25} />;
		case 'Interface':
			return <VscSymbolInterface className="shrink-0" size={25} />;
		case 'Property':
			return <VscSymbolProperty className="shrink-0" size={25} />;
		case 'TypeAlias':
			return <VscSymbolField className="shrink-0" size={25} />;
		case 'Variable':
			return <VscSymbolVariable className="shrink-0" size={25} />;
		default:
			return <VscSymbolMethod className="shrink-0" size={25} />;
	}
}

export function CmdKDialog() {
	const pathname = usePathname();
	const router = useRouter();
	const dialog = useCmdK();
	const [search, setSearch] = useState('');
	const [searchResults, setSearchResults] = useState<any[]>([]);

	const packageName = pathname?.split('/').slice(3, 4)[0];
	const branchName = pathname?.split('/').slice(4, 5)[0];

	const searchResultItems = useMemo(
		() =>
			searchResults?.map((item, idx) => (
				<Command.Item
					className="dark:border-dark-100 dark:hover:bg-dark-300 dark:active:bg-dark-200 [&[aria-selected]]:ring-blurple [&[aria-selected]]:ring-width-2 my-1 flex transform-gpu cursor-pointer select-none appearance-none flex-row place-content-center rounded bg-transparent px-4 py-2 text-base font-semibold leading-none text-black outline-0 hover:bg-neutral-100 active:translate-y-px active:bg-neutral-200 dark:text-white [&[aria-selected]]:ring"
					key={`${item.id}-${idx}`}
					onSelect={() => {
						router.push(item.path);
						dialog!.setOpen(false);
					}}
				>
					<div className="flex grow flex-row place-content-between place-items-center gap-4">
						<div className="flex flex-row place-items-center gap-4">
							{resolveIcon(item.kind)}
							<div className="w-50 sm:w-100 flex flex-col">
								<h2 className="font-semibold">{item.name}</h2>
								<div className="line-clamp-1 text-sm font-normal">{item.summary}</div>
								<div className="line-clamp-1 hidden text-xs font-light opacity-75 dark:opacity-50 sm:block">
									{item.path}
								</div>
							</div>
						</div>
						<VscArrowRight className="shrink-0" size={20} />
					</div>
				</Command.Item>
			)) ?? [],
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[searchResults],
	);

	useKey(
		(event) => {
			if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
				event.preventDefault();
				return true;
			}

			return false;
		},
		dialog!.toggle,
		{ event: 'keydown', options: {} },
		[],
	);

	useEffect(() => {
		if (!dialog!.open) {
			setSearch('');
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [dialog!.open]);

	useEffect(() => {
		const searchDoc = async (searchString: string, version: string) => {
			const res = await client.index(`${packageName}-${version}`).search(searchString, { limit: 5 });
			setSearchResults(res.hits);
		};

		if (search && packageName) {
			void searchDoc(search, branchName?.replaceAll('.', '-') ?? 'main');
		} else {
			setSearchResults([]);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [search]);

	return (
		<Dialog className="fixed left-1/2 top-1/4 z-50 -translate-x-1/2" state={dialog!}>
			<Command
				className="dark:bg-dark/50 min-w-xs sm:min-w-lg dark:border-dark-100 border-light-900 max-w-xs rounded border bg-white/50 shadow backdrop-blur-md sm:max-w-lg"
				label="Command Menu"
				shouldFilter={false}
			>
				<Command.Input
					className="dark:bg-dark/50 caret-blurple placeholder:text-dark-300/75 dark:border-dark-100 border-light-900 rounded-b-0 w-full rounded border-0 border-b bg-white/50 p-4 text-lg outline-0 dark:placeholder:text-white/75"
					onValueChange={setSearch}
					placeholder="Quick search..."
					value={search}
				/>
				<Command.List className="pt-0">
					<Command.Empty className="p-4 text-center">No results found</Command.Empty>
					{search ? searchResultItems : null}
				</Command.List>
			</Command>
		</Dialog>
	);
}
