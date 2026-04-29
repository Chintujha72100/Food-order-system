export default function Footer() {
    return (
        <footer className="bg-secondary text-gray-400 py-12 mt-auto">
            <div className="container mx-auto px-6 text-center">
                <p>&copy; {new Date().getFullYear()} CraveBite. All rights reserved.</p>
            </div>
        </footer>
    );
}
