
package main;

public class Parameters {
    // Input files are multiple contigs
    public static boolean multiContigs = false;

    //normalization
    public static double normPercentile = Config.getDouble("normPercentile");

    //core prediction
    public static double minCliffHeight = Config.getDouble("minCliffHeight"); //stepheight
    public static double minCliffHeightDiscount = Config.getDouble("minCliffHeightDiscount"); //stepHeigthReduction
    public static double minCliffFactor = Config.getDouble("minCliffFactor"); //stepfactor
    public static double minCliffFactorDiscount = Config.getDouble("minCliffFactorDiscount"); //stepFactorReduction
    public static int minPlateauLength = Config.getInt("minPlateauLength"); //stepLength
    public static double minNormalHeight = Config.getDouble("minNormalHeight"); //baseHeight
    public static double min5primeToNormalFactor = Config.getDouble("min5primeToNormalFactor"); //enrichmentFactor
    public static double maxNormalTo5primeFactor = Config.getDouble("maxNormalTo5primeFactor"); //processingSiteFactor

    //TEX normalization
    public static double texNormPercentile = Config.getDouble("texNormPercentile");
    //public static int	texNormReferenceIndex	= Config.getInt("texNormReferenceIndex");

    //clustering
    public static int maxTSSinClusterDistance = Config.getInt("maxTSSinClusterDistance");
    public static String TSSinClusterSelectionMethod = Config.getString("TSSinClusterSelectionMethod");

    //comparison
    //public static int minNumMatches	= 3;
    public static int allowedShift = Config.getInt("allowedCompareShift");
    //public static double minHeightFactorForDoubleCount = 10.0;

    //replicates
    public static int numReplicates = Config.getInt("numReplicates");
    public static int minNumRepMatches = Config.getInt("minNumRepMatches");
    public static int allowedRepShift = Config.getInt("allowedRepCompareShift");

    //classification
    public static int maxUTRlength = Config.getInt("maxUTRlength");
    public static int maxASutrLength = Config.getInt("maxASutrLength");

    //other
    public static int maxGapLengthInGene = Config.getInt("maxGapLengthInGene");
    public static boolean writeNocornacFiles = Config.getBoolean("writeNocornacFiles");

    public static void refresh() {
        multiContigs = false;

        normPercentile = Config.getDouble("normPercentile");

        //core prediction
        minCliffHeight = Config.getDouble("minCliffHeight");
        minCliffHeightDiscount = Config.getDouble("minCliffHeightDiscount");
        minCliffFactor = Config.getDouble("minCliffFactor");
        minCliffFactorDiscount = Config.getDouble("minCliffFactorDiscount");
        minPlateauLength = Config.getInt("minPlateauLength");
        minNormalHeight = Config.getDouble("minNormalHeight");
        min5primeToNormalFactor = Config.getDouble("min5primeToNormalFactor");
        maxNormalTo5primeFactor = Config.getDouble("maxNormalTo5primeFactor");

        //TEX normalization
        texNormPercentile = Config.getDouble("texNormPercentile");
        //public static int	texNormReferenceIndex	= Config.getInt("texNormReferenceIndex");

        //clustering
        maxTSSinClusterDistance = Config.getInt("maxTSSinClusterDistance");
        TSSinClusterSelectionMethod = Config.getString("TSSinClusterSelectionMethod");

        //comparison
        //minNumMatches	= 3;
        allowedShift = Config.getInt("allowedCompareShift");
        //minHeightFactorForDoubleCount = 10.0;

        //replicates
        numReplicates = Config.getInt("numReplicates");
        minNumRepMatches = Config.getInt("minNumRepMatches");
        allowedRepShift = Config.getInt("allowedRepCompareShift");

        //classification
        maxUTRlength = Config.getInt("maxUTRlength");
        maxASutrLength = Config.getInt("maxASutrLength");

        //other
        maxGapLengthInGene = Config.getInt("maxGapLengthInGene");
        writeNocornacFiles = Config.getBoolean("writeNocornacFiles");
    }

    //*/
}
