import SwiftUI

struct ProfileView: View {
    @State private var name = ""
    @State private var bio = ""
    @State private var selectedTab = 0
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Profile Info").foregroundColor(.yellow)) {
                    TextField("DJ Name", text: $name)
                    TextField("Bio", text: $bio)
                }
                
                Section {
                    Button("Save Profile") {
                        // Save profile logic
                    }
                    .frame(maxWidth: .infinity)
                    .foregroundColor(.black)
                    .padding()
                    .background(Color.yellow)
                    .cornerRadius(10)
                }
                
                Section(header: Text("My Stats").foregroundColor(.yellow)) {
                    HStack {
                        Text("Transitions")
                        Spacer()
                        Text("12")
                            .foregroundColor(.yellow)
                    }
                    
                    HStack {
                        Text("Total Votes")
                        Spacer()
                        Text("234")
                            .foregroundColor(.yellow)
                    }
                    
                    HStack {
                        Text("Average Rating")
                        Spacer()
                        Text("4.5")
                            .foregroundColor(.yellow)
                    }
                }
            }
            .navigationTitle("Profile")
        }
    }
}

#Preview {
    ProfileView()
}