// // components/artisan-profile/SkillsSelector.tsx
// 'use client'

// import { useState } from 'react'
// import { FaChevronDown, FaChevronUp, FaCheckCircle } from 'react-icons/fa'

// interface SkillsSelectorProps {
//   value: {
//     categories: string[]
//     skills: string[]
//   }
//   onChange: (value: { categories: string[]; skills: string[] }) => void
// }

// const artisanCategories = [
//   {
//     id: 'A',
//     title: 'Home & Building Services',
//     skills: [
//       'Plumber',
//       'Electrician',
//       'Carpenter',
//       'Mason / Bricklayer',
//       'Painter / Decorator',
//       'Tiler',
//     ],
//   },
//   {
//     id: 'B',
//     title: 'Mechanical & Technical Services',
//     skills: [
//       'Generator Repair Technician',
//       'AC Technician (Installation & Repairs)',
//       'Refrigerator & Freezer Technician',
//       'Washing Machine Technician',
//     ],
//   },
//   {
//     id: 'C',
//     title: 'General Maintenance',
//     skills: [
//       'Handyman (Minor repairs)',
//       'Welder / Fabricator',
//       'Aluminum Fabricator (Doors & Windows)',
//     ],
//   },
//   {
//     id: 'D',
//     title: 'Interior & Finishing Services',
//     skills: [
//       'POP Ceiling Installer',
//       'Interior Decorator',
//       'Furniture Maker',
//       'Upholsterer',
//     ],
//   },
//   {
//     id: 'E',
//     title: 'Security & Installations',
//     skills: [
//       'CCTV Installer',
//       'Solar Panel Installer',
//       'Electric Fence Installer',
//     ],
//   },
//   {
//     id: 'F',
//     title: 'ICT & Digital Technicians',
//     skills: [
//       'Computer Repair Technician',
//       'Phone Repair Technician',
//       'Network / Internet Technician',
//     ],
//   },
//   {
//     id: 'G',
//     title: 'Personal & Domestic Services',
//     skills: [
//       'Cleaner / Janitorial Services',
//       'Home Care Assistant',
//       'Laundry & Dry Cleaning Agent',
//       'Barber/Hairdresser',
//     ],
//   },
//   {
//     id: 'H',
//     title: 'Automotive Artisans',
//     skills: [
//       'Auto Mechanic',
//       'Auto Electrician',
//       'Panel Beater',
//       'Car Painter',
//     ],
//   },
//   {
//     id: 'I',
//     title: 'Specialised & Industrial Artisans',
//     skills: [
//       'Industrial Electrician',
//       'Industrial Plumber',
//       'HVAC Engineer',
//       'Heavy Equipment Technician',
//     ],
//   },
//   {
//     id: 'J',
//     title: 'Event & Creative Service Artisans',
//     skills: [
//       'Event Electrician',
//       'Event Sound Technician',
//       'Event Lighting Technician',
//       'Stage Fabricator',
//     ],
//   },
// ]

// export default function SkillsSelector({ value, onChange }: SkillsSelectorProps) {
//   const [expanded, setExpanded] = useState<string[]>([])

//   const toggleExpand = (categoryId: string) => {
//     setExpanded(prev =>
//       prev.includes(categoryId)
//         ? prev.filter(id => id !== categoryId)
//         : [...prev, categoryId]
//     )
//   }

//   const isCategorySelected = (title: string) => value.categories.includes(title)

//   const handleCategoryChange = (title: string, checked: boolean) => {
//     let newCategories = [...value.categories]

//     if (checked) {
//       if (!newCategories.includes(title)) {
//         newCategories = [...newCategories, title]
//       }
//     } else {
//       newCategories = newCategories.filter(c => c !== title)
//       // Optional: remove skills from this category when deselected
//       const cat = artisanCategories.find(c => c.title === title)
//       if (cat) {
//         const catSkills = cat.skills
//         const newSkills = value.skills.filter(s => !catSkills.includes(s))
//         onChange({ categories: newCategories, skills: newSkills })
//         return
//       }
//     }

//     onChange({ ...value, categories: newCategories })
//   }

//   const handleSkillChange = (skill: string, checked: boolean) => {
//     let newSkills = [...value.skills]

//     if (checked) {
//       if (!newSkills.includes(skill)) {
//         newSkills.push(skill)
//       }
//     } else {
//       newSkills = newSkills.filter(s => s !== skill)
//     }

//     onChange({ ...value, skills: newSkills })
//   }

//   return (
//     <div className="space-y-6">
//       <div>
//         <h3 className="text-lg font-semibold text-gray-800 mb-4">
//           Select Your Main Service Categories
//         </h3>

//         <div className="space-y-3">
//           {artisanCategories.map(category => {
//             const isExpanded = expanded.includes(category.title)
//             const isSelected = isCategorySelected(category.title)

//             return (
//               <div
//                 key={category.id}
//                 className={`border rounded-lg overflow-hidden transition-all ${
//                   isSelected ? 'border-[var(--orange)] bg-orange-50/30' : 'border-gray-200'
//                 }`}
//               >
//                 {/* Category header */}
//                 <div
//                   className="flex items-center justify-between px-4 py-3 cursor-pointer bg-gray-50 hover:bg-gray-100"
//                   onClick={() => toggleExpand(category.title)}
//                 >
//                   <div className="flex items-center gap-3">
//                     <input
//                       type="checkbox"
//                       checked={isSelected}
//                       onChange={e => handleCategoryChange(category.title, e.target.checked)}
//                       onClick={e => e.stopPropagation()}
//                       className="h-5 w-5 text-[var(--orange)] rounded border-gray-300 focus:ring-[var(--orange)]"
//                     />
//                     <span className="font-medium text-gray-900">
//                       {category.title}
//                     </span>
//                   </div>

//                   <div className="flex items-center gap-3 text-sm text-gray-500">
//                     <span>{category.skills.length} skills</span>
//                     {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
//                   </div>
//                 </div>

//                 {/* Skills list - shown when expanded */}
//                 {isExpanded && (
//                   <div className="px-4 pb-4 pt-2 bg-white">
//                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
//                       {category.skills.map(skill => (
//                         <label
//                           key={skill}
//                           className="flex items-center gap-2 py-1.5 px-2 hover:bg-gray-50 rounded cursor-pointer"
//                         >
//                           <input
//                             type="checkbox"
//                             checked={value.skills.includes(skill)}
//                             onChange={e => handleSkillChange(skill, e.target.checked)}
//                             className="h-4 w-4 text-[var(--orange)] rounded border-gray-300 focus:ring-[var(--orange)]"
//                           />
//                           <span className="text-sm text-gray-700">{skill}</span>
//                         </label>
//                       ))}
//                     </div>
//                   </div>
//                 )}
//               </div>
//             )
//           })}
//         </div>
//       </div>

//       {/* Selected summary */}
//       {value.skills.length > 0 && (
//         <div className="mt-8 p-5 bg-gray-50 border border-gray-200 rounded-xl">
//           <div className="flex items-center justify-between mb-3">
//             <h4 className="font-medium text-gray-800">
//               Selected Skills ({value.skills.length})
//             </h4>
//             {value.categories.length > 0 && (
//               <span className="text-sm text-gray-600">
//                 from {value.categories.length} categor
//                 {value.categories.length === 1 ? 'y' : 'ies'}
//               </span>
//             )}
//           </div>

//           <div className="flex flex-wrap gap-2">
//             {value.skills.map(skill => (
//               <span
//                 key={skill}
//                 className="px-3 py-1.5 bg-blue-50 text-blue-800 text-sm rounded-full border border-blue-200"
//               >
//                 {skill}
//               </span>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }