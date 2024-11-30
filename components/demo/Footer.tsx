import { Github, Twitter, Linkedin } from 'lucide-react'

export function Footer() {
    return (
        <footer className="bg-white shadow-md mt-12">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">About Us</h3>
                        <p className="mt-4 text-base text-gray-500">
                            CertifyPro is your go-to platform for creating professional certificates with ease and style.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Quick Links</h3>
                        <ul className="mt-4 space-y-4">
                            <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">FAQ</a></li>
                            <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Privacy Policy</a></li>
                            <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Terms of Service</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Connect With Us</h3>
                        <div className="flex space-x-6 mt-4">
                            <a href="#" className="text-gray-400 hover:text-gray-500">
                                <span className="sr-only">GitHub</span>
                                <Github className="h-6 w-6" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-gray-500">
                                <span className="sr-only">Twitter</span>
                                <Twitter className="h-6 w-6" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-gray-500">
                                <span className="sr-only">LinkedIn</span>
                                <Linkedin className="h-6 w-6" />
                            </a>
                        </div>
                    </div>
                </div>
                <div className="mt-8 border-t border-gray-200 pt-8">
                    <p className="text-base text-gray-400 xl:text-center">
                        &copy; 2024 CertifyPro. All rights reserved.<a
                            href="https://github.com/mochrks"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                        >
                            @mochrks
                        </a>
                    </p>
                </div>
            </div>
        </footer>
    )
}

