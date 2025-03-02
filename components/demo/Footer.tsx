export function Footer() {
    return (
        <footer className="shadow-md mt-12 border-t">
            <div className="flex container mx-auto p-5 items-center justify-center">
                <p className="text-base text-gray-400 ">
                    &copy; {new Date().getFullYear()} Certify App. All rights reserved.<a
                        href="https://github.com/mochrks"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                    >
                        @mochrks
                    </a>
                </p>

            </div>
        </footer>
    )
}

