
package main;

public class App {

    /**
     * @param args: JSON String with all parameters, file paths
     * @throws Exception
     */
    public static void main(String[] args) throws Exception {

        if (args.length == 1) {
            Main main = new Main(args[0]);
            main.compute();
        } else {
            System.err.println("Wrong input: [JSON String]");
        }
    }
}