export default function LoadingListPage() {
    return (
        <div className="bg-gray-200/70 min-h-screen">
            <main className="flex flex-col max-w-screen-xl mx-auto p-4 lg:p-12 gap-6">
                {/* Search card */}
                <div className="p-8 rounded-xl bg-white flex flex-col gap-4">
                    <div className="flex flex-col gap-4">
                        <div className="w-full md:w-1/6 h-8 bg-gray-200 rounded-lg"></div>
                        <div className='flex flex-col md:flex-row gap-4'>
                            <div className="w-full h-14 bg-gray-200 rounded-2xl"></div>
                            <div className="w-full h-14 md:size-14 bg-gray-200 rounded-2xl"></div>
                        </div>
                    </div>
                </div>
                <div className='flex flex-col gap-8 p-8 bg-white rounded-xl min-h-[26rem]'>
                    <div className="flex flex-col gap-12">
                        <div className="w-full md:w-1/6 h-8 bg-gray-200 rounded-lg"></div>
                        <div className="w-full h-80 bg-gray-200 rounded-2xl"></div>

                    </div>
                </div>
            </main>
        </div>
    )
}