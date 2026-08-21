import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { BookOpenIcon, AcademicCapIcon, ShieldCheckIcon, DocumentArrowUpIcon, MagnifyingGlassIcon, StarIcon } from '@heroicons/react/24/outline';

const features = [
  { icon: DocumentArrowUpIcon, title: 'Upload Resources', description: 'Share your academic materials with fellow students in your department.' },
  { icon: MagnifyingGlassIcon, title: 'Easy Discovery', description: 'Find resources filtered by your department, academic level, and semester.' },
  { icon: StarIcon, title: 'Rate & Review', description: 'Help others by rating resources and leaving reviews.' },
  { icon: ShieldCheckIcon, title: 'Verified & Secure', description: 'Only verified Wollo University students can access the platform.' },
];

const stats = [
  { value: '500+', label: 'Resources' },
  { value: '1,000+', label: 'Students' },
  { value: '15+', label: 'Departments' },
  { value: '4.8', label: 'Average Rating' },
];

const departments = [
  'Software Engineering', 'Information Technology', 'Computer Science',
  'Mechanical Engineering', 'Electrical Engineering', 'Civil Engineering',
  'Architecture', 'Biomedical Engineering', 'Fashion Design'
];

const faqs = [
  { q: 'How do I create an account?', a: 'Register with your @wollo.edu.et email and student ID. Upload your university ID card for verification.' },
  { q: 'When can I start using resources?', a: 'After admin verification and assignment to a department, you can access all resources.' },
  { q: 'Can I upload resources?', a: 'Yes! Once verified, you can upload resources for your department and academic level.' },
  { q: 'How are resources organized?', a: 'Resources are filtered by department, academic level, and semester for easy discovery.' },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">WS</span>
              </div>
              <span className="text-lg font-bold text-gray-900">WolloShare</span>
            </Link>
            <div className="flex items-center gap-4">
              {user ? (
                <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} className="btn-primary text-sm">
                  Dashboard
                </Link>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Link
                      to="/login?role=student"
                      className="px-4 py-2 rounded-lg text-sm font-medium text-primary-700 bg-primary-50 border border-primary-200 hover:bg-primary-100 transition-colors"
                    >
                      Student Login
                    </Link>
                    <Link
                      to="/login?role=admin"
                      className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 transition-colors"
                    >
                      Admin Login
                    </Link>
                  </div>
                  <Link to="/register" className="btn-primary text-sm">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
            Wollo University's{' '}
            <span className="text-primary-600">Academic Resource</span>{' '}
            Sharing Platform
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            Discover, share, and collaborate on academic resources with verified students 
            from your department. Built exclusively for Wollo University.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link to="/register" className="btn-primary text-lg px-8 py-3">
              Get Started
            </Link>
            <a href="#features" className="btn-secondary text-lg px-8 py-3">
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Everything You Need
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="card text-center hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-20 px-4 bg-primary-600">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {stats.map((stat, idx) => (
              <div key={idx}>
                <p className="text-4xl font-bold text-white">{stat.value}</p>
                <p className="mt-2 text-primary-200">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Departments */}
      <section id="departments" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Supported Departments
          </h2>
          <p className="text-center text-gray-500 mb-12 max-w-2xl mx-auto">
            Access resources from a wide range of engineering and technology departments
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((dept, idx) => (
              <div key={idx} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-primary-50 transition-colors">
                <AcademicCapIcon className="h-6 w-6 text-primary-600 flex-shrink-0" />
                <span className="text-gray-700 font-medium">{dept}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <details key={idx} className="bg-white rounded-xl border border-gray-200 group">
                <summary className="px-6 py-4 cursor-pointer font-medium text-gray-900 hover:text-primary-600 list-none flex items-center justify-between">
                  {faq.q}
                  <svg className="h-5 w-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="px-6 pb-4 text-gray-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Start Sharing?
          </h2>
          <p className="text-gray-500 mb-8 max-w-2xl mx-auto">
            Join thousands of Wollo University students already using WolloShare 
            to access and share academic resources.
          </p>
          <Link to="/register" className="btn-primary text-lg px-10 py-3">
            Create Your Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-200">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} WolloShare. Wollo University Academic Resource Sharing Platform.
          </p>
        </div>
      </footer>
    </div>
  );
}

